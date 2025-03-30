package com.mesadigital.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Send
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mesadigital.R
import com.mesadigital.model.ChatMessage
import com.mesadigital.model.Participant
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * Painel de chat para a sala
 */
@Composable
fun ChatPanel(
    messages: List<ChatMessage>,
    participants: List<Participant>,
    onSendMessage: (String) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val focusManager = LocalFocusManager.current
    var messageText by remember { mutableStateOf("") }
    val scrollState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    
    // Efeito para rolar para a última mensagem quando novas mensagens são recebidas
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            scrollState.animateScrollToItem(messages.size - 1)
        }
    }
    
    Card(
        modifier = modifier,
        elevation = 8.dp,
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // Cabeçalho
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colors.primary)
                    .padding(8.dp)
            ) {
                Text(
                    text = stringResource(R.string.chat_title),
                    style = MaterialTheme.typography.subtitle1,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.align(Alignment.Center)
                )
                
                IconButton(
                    onClick = onClose,
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close chat",
                        tint = Color.White
                    )
                }
            }
            
            // Lista de mensagens
            if (messages.isEmpty()) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = stringResource(R.string.empty_chat),
                        style = MaterialTheme.typography.body1,
                        color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f),
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp),
                    state = scrollState,
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    items(messages) { message ->
                        MessageItem(
                            message = message,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                }
            }
            
            // Campo de entrada de mensagem
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colors.surface)
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Campo de texto
                OutlinedTextField(
                    value = messageText,
                    onValueChange = { messageText = it },
                    placeholder = { Text(stringResource(R.string.message_hint)) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        backgroundColor = MaterialTheme.colors.surface
                    ),
                    keyboardOptions = KeyboardOptions.Default.copy(
                        imeAction = ImeAction.Send
                    ),
                    keyboardActions = KeyboardActions(
                        onSend = {
                            if (messageText.isNotBlank()) {
                                onSendMessage(messageText)
                                messageText = ""
                                focusManager.clearFocus()
                            }
                        }
                    )
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                // Botão de enviar
                IconButton(
                    onClick = {
                        if (messageText.isNotBlank()) {
                            onSendMessage(messageText)
                            messageText = ""
                            focusManager.clearFocus()
                            
                            // Rolar para a última mensagem
                            coroutineScope.launch {
                                scrollState.animateScrollToItem(messages.size)
                            }
                        }
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(
                            if (messageText.isBlank()) MaterialTheme.colors.primary.copy(alpha = 0.5f) 
                            else MaterialTheme.colors.primary
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = "Send",
                        tint = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun MessageItem(
    message: ChatMessage,
    modifier: Modifier = Modifier
) {
    val dateFormat = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }
    val formattedTime = remember(message.timestamp) { 
        dateFormat.format(Date(message.timestamp))
    }
    
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = if (message.isLocalUser) Alignment.End else Alignment.Start
    ) {
        // Nome do remetente
        Text(
            text = if (message.isLocalUser) "Você" else message.senderName,
            style = MaterialTheme.typography.caption,
            color = if (message.isLocalUser) MaterialTheme.colors.primary else MaterialTheme.colors.secondary,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
        
        // Conteúdo da mensagem
        Card(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .padding(top = 2.dp),
            backgroundColor = if (message.isLocalUser) 
                MaterialTheme.colors.primary.copy(alpha = 0.2f) 
            else 
                MaterialTheme.colors.surface,
            elevation = 1.dp,
            shape = RoundedCornerShape(
                topStart = if (!message.isLocalUser) 0.dp else 8.dp,
                topEnd = if (message.isLocalUser) 0.dp else 8.dp,
                bottomStart = 8.dp,
                bottomEnd = 8.dp
            )
        ) {
            Column(
                modifier = Modifier.padding(8.dp)
            ) {
                Text(
                    text = message.text,
                    style = MaterialTheme.typography.body1
                )
                
                Text(
                    text = formattedTime,
                    style = MaterialTheme.typography.caption,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f),
                    modifier = Modifier
                        .align(Alignment.End)
                        .padding(top = 4.dp)
                )
            }
        }
    }
}
